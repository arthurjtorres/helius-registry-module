export default interface PersonInterface {
  personId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate?: Date;

  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
