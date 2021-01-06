import { withNavigationWatcher } from './contexts/navigation';
import { HomePage, TasksPage, ProfilePage,OrdersPage,OrderPage,PartnerPage } from './pages';

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
    path: '/order/:id',
    component: OrderPage
  },
  {
    path: '/partner/:id',
    component: PartnerPage
  }
];

export default routes.map(route => {
  return {
    ...route,
    component: withNavigationWatcher(route.component)
  };
});
