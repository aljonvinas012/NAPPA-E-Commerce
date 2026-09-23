import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export const updatePhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });
    const user = await User.findByIdAndUpdate(req.userId, { phone }, { new: true }).select('-passwordHash');
    res.json({ message: 'Phone number updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Could not update phone number.' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not change password.' });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.addresses.length >= 3) {
      return res.status(400).json({ message: 'You can only save up to 3 addresses.' });
    }

    const isFirst = user.addresses.length === 0;
    const newAddress = { ...req.body, isDefault: isFirst ? true : !!req.body.isDefault };

    if (newAddress.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Could not add address.' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const address = user.addresses.find((a) => a._id?.toString() === req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found.' });

    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    Object.assign(address, req.body);

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Could not update address.' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const wasDefault = user.addresses.find((a) => a._id?.toString() === req.params.addressId)?.isDefault;
    user.addresses = user.addresses.filter((a) => a._id?.toString() !== req.params.addressId) as any;

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Could not delete address.' });
  }
};
