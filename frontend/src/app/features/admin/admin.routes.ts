import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'categorias',
        pathMatch: 'full'
      },
      {
        path: 'categorias',
        loadComponent: () => import('./pages/categories-list/categories-list.component').then(m => m.CategoriesListComponent)
      },
      {
        path: 'categorias/:id',
        loadComponent: () => import('./pages/category-detail/category-detail.component').then(m => m.CategoryDetailComponent)
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/products-list/products-list.component').then(m => m.ProductsListComponent)
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'productos/:id',
        loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent)
      }
    ]
  }
];
