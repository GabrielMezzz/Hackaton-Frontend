import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalog/pages/catalog-page/catalog-page.component').then(m => m.CatalogPageComponent)
  },
  {
    path: 'catalogo/:categoria',
    loadComponent: () => import('./features/catalog/pages/catalog-page/catalog-page.component').then(m => m.CatalogPageComponent)
  },
  {
    path: 'prenda/:key',
    loadComponent: () => import('./features/product-detail/pages/product-page/product-page.component').then(m => m.ProductPageComponent)
  },
  {
    path: 'carrito',
    loadComponent: () => import('./features/cart/pages/cart-page/cart-page.component').then(m => m.CartPageComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/pages/checkout-page/checkout-page.component').then(m => m.CheckoutPageComponent)
  },
  {
    path: 'reclamaciones',
    loadComponent: () => import('./features/claims/pages/claims-page/claims-page.component').then(m => m.ClaimsPageComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
