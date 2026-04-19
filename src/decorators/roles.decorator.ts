import { SetMetadata } from '@nestjs/common';
import { Role } from '../enum/RoleUser.enum';


export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
