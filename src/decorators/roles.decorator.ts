import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/enum/RoleUser.enum';


export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
