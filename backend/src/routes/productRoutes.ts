import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadProductImage, getAllProductsAdmin, getCategories,
} from '../controllers/productController';
import { auth, adminOnly } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/admin/all', auth, adminOnly, getAllProductsAdmin);
router.get('/:id', getProductById);
router.post('/', auth, adminOnly, createProduct);
router.put('/:id', auth, adminOnly, updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);
router.post('/upload-image', auth, adminOnly, uploadSingle, uploadProductImage);
export default router;
