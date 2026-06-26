export type UserRole = 'admin' | 'operador';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin Principal',
    role: 'admin',
    avatar: 'AP',
  },
  {
    id: '2',
    email: 'operador@test.com',
    password: 'oper123',
    name: 'Operador Demo',
    role: 'operador',
    avatar: 'OD',
  },
];
