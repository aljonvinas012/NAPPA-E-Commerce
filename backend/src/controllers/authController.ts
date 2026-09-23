import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';

// Short-lived token issued after a correct email+password, used only to
// prove "this device just passed step 1" while the person enters their
// authenticator app code for step 2. It carries no login power on its
// own — it can only be redeemed at POST /auth/mfa/verify.
const MFA_TOKEN_TTL = '5m';
const generateMfaToken = (userId: string, purpose: 'setup' | 'login') =>
  jwt.sign({ id: userId, purpose: `mfa_${purpose}` }, process.env.JWT_SECRET as string, { expiresIn: MFA_TOKEN_TTL });

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, gender, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Role is ALWAYS forced to 'customer' on public registration.
    // Admin accounts are only created via the seed script — never through this endpoint.
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || '',
      gender: gender || '',
      passwordHash,
      role: 'customer',
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Something went wrong while creating your account.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+mfaSecret');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account has been suspended.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Admin accounts always require a second factor (Authenticator App /
    // TOTP code) before a real session token is issued — customer
    // accounts log in normally, in one step.
    if (user.role === 'admin') {
      if (!user.mfaSecret) {
        // Truly first-ever login: no secret exists yet at all, so generate
        // a brand-new one and hand back a QR code so the admin can scan it
        // into Google Authenticator / Authy / Microsoft Authenticator.
        const secret = speakeasy.generateSecret({
          name: `Nappa Admin (${user.email})`,
          issuer: 'Nappa Food & Crafts',
          length: 20,
        });
        user.mfaSecret = secret.base32;
        await user.save();

        const qrCode = await qrcode.toDataURL(secret.otpauth_url as string);

        return res.json({
          mfaRequired: true,
          mfaSetup: true,
          mfaToken: generateMfaToken(user.id, 'setup'),
          qrCode,
          manualEntryKey: secret.base32,
        });
      }

      if (!user.mfaEnabled) {
        // A secret already exists (a previous login already showed the QR)
        // but the admin hasn't confirmed it with a code yet. Re-show the
        // SAME secret/QR instead of generating a new one — generating a
        // fresh secret here would silently invalidate whatever the admin
        // already scanned into their authenticator app, which is why codes
        // kept failing even right after scanning.
        const otpauthUrl = speakeasy.otpauthURL({
          secret: user.mfaSecret,
          label: `Nappa Admin (${user.email})`,
          issuer: 'Nappa Food & Crafts',
          encoding: 'base32',
        });
        const qrCode = await qrcode.toDataURL(otpauthUrl);

        return res.json({
          mfaRequired: true,
          mfaSetup: true,
          mfaToken: generateMfaToken(user.id, 'setup'),
          qrCode,
          manualEntryKey: user.mfaSecret,
        });
      }

      // Already fully set up: every login from here on just asks for the
      // 6-digit code, as intended.
      return res.json({
        mfaRequired: true,
        mfaSetup: false,
        mfaToken: generateMfaToken(user.id, 'login'),
      });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
};

// Step 2 of admin login: verify the 6-digit code from the authenticator
// app against the secret, and only then issue the real session token.
export const verifyMfa = async (req: Request, res: Response) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) {
      return res.status(400).json({ message: 'Please enter the 6-digit code from your authenticator app.' });
    }

    let decoded: { id: string; purpose: string };
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET as string) as any;
    } catch {
      return res.status(401).json({ message: 'This verification step has expired. Please log in again.' });
    }
    if (!decoded.purpose?.startsWith('mfa_')) {
      return res.status(401).json({ message: 'Invalid verification token.' });
    }

    const user = await User.findById(decoded.id).select('+mfaSecret');
    if (!user || user.role !== 'admin' || !user.mfaSecret) {
      return res.status(401).json({ message: 'Invalid verification token.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account has been suspended.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: String(code).trim(),
      window: 1, // allow 1 step (±30s) of clock drift
    });

    if (!verified) {
      return res.status(401).json({ message: 'Incorrect code. Please check your authenticator app and try again.' });
    }

    if (!user.mfaEnabled) {
      user.mfaEnabled = true;
      await user.save();
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ message: 'Something went wrong while verifying your code.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
};
