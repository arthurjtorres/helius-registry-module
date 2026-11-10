export const controlRoutes = {
  /** Usuários ativos vinculados a um funcionário (`employee_user`). */
  usersByEmployee: (employeeId: string) => `/users?fkEmployeeId=${encodeURIComponent(employeeId)}`,
};
