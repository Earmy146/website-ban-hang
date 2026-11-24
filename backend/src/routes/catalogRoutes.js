import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkArchiveProducts,
  importProducts,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/catalogController.js';

const router = Router();

// 3. Sản phẩm (Products) - Đặt các nhánh tĩnh trước /:id
router.get('/products', getProducts);
router.post('/products', createProduct);
router.post('/products/bulk-archive', bulkArchiveProducts);
router.post('/products/import', importProducts);
router.post('/products/:id/duplicate', duplicateProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// 4. Danh mục sản phẩm (Categories)
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// 5. Thương hiệu (Brands)
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

export default router;
