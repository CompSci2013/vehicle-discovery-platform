/*
  DEMO BARREL EXPORTS

  PURPOSE:
  Clean imports throughout the application.

  USAGE:
  import { DemoApiService, DEMO_MANUFACTURERS } from '@app/demo';

  Instead of:
  import { DemoApiService } from '@app/demo/demo-api.service';
  import { DEMO_MANUFACTURERS } from '@app/demo/demo-data';
*/

// Data
export * from './demo-data';

// Services
export * from './demo-api.service';

// Module
export * from './demo.module';
