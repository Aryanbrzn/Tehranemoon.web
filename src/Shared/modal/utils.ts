import { EnvironmentInjector, InjectionToken, Injector, Provider } from '@angular/core';

export function createInjector(parent: Injector, providers: Provider[]) {
    // در Angular 16+ این روش Injector تمیز و سازگار است
    return Injector.create({ providers, parent });
}
