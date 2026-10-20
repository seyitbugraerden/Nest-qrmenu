import { SetMetadata } from '@nestjs/common';
export const PUBLIC_ENDPOINT = 'auth:public';
export const Public = () => SetMetadata(PUBLIC_ENDPOINT, true);
