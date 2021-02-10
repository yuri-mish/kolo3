import { withNavigationWatcher } from './contexts/navigation';
import { HomePage, TasksPage, ProfilePage,OrdersPage,OrderPage,PartnerPage,ActsPage } from './pages';
import { TestPage } from './pages/test/test';

const routes = [
  {
    path: '/tasks',
    component: TasksPage
  },
  {
    path: '/profile',
    component: ProfilePage
  },
  {
    path: '/home',
    component: HomePage
  },
  {
    path: '/orders',
    component: OrdersPage
  },
  {
    path: '/acts',
    component: ActsPage,
  },
  {
    path: '/order/:id',
    component: OrderPage
  },
  {
    path: '/partner/:id',
    component: PartnerPage
  },
  {
    path: '/test/',
    component: TestPage
  }
];

export default routes.map(route => {
  return {
    ...route,
    component: withNavigationWatcher(route.component)
  };
});
