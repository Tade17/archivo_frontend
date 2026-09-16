import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <main class="login-page">
      <section class="login-story" aria-label="Archivo Municipal de San José">
        <div class="login-story__content">
          <div class="municipal-lockup">
            <img src="/design/kSOoW.png" width="64" height="74" alt="Escudo de la Municipalidad de San José">
            <p>MUNICIPALIDAD DISTRITAL<br><strong>DE SAN JOSÉ</strong></p>
          </div>
          <h2>La memoria de<br>nuestra ciudad,<br><strong>a tu alcance.</strong></h2>
          <p class="login-story__copy">Consulta, organiza y preserva el archivo municipal desde un mismo lugar.</p>
        </div>
      </section>

      <section class="login-access">
        <div class="login-access__inner">
          <div class="mobile-lockup">
            <img src="/design/kSOoW.png" width="46" height="53" alt="Escudo de la Municipalidad de San José">
            <p>MUNICIPALIDAD DISTRITAL<br><strong>DE SAN JOSÉ</strong></p>
          </div>

          <form #form="ngForm" (ngSubmit)="login(form)" novalidate>
            <div class="login-heading">
              <p>Archivo Municipal</p>
              <h1>Bienvenido de nuevo</h1>
              <span>Ingresa con tu cuenta institucional para continuar.</span>
            </div>

            @if (error()) {
              <div class="login-alert" role="alert" aria-live="assertive">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v5m0 3.5v.01M10.3 4.3 2.7 17.5A1.5 1.5 0 0 0 4 19.75h16a1.5 1.5 0 0 0 1.3-2.25L13.7 4.3a2 2 0 0 0-3.4 0Z"/>
                </svg>
                <div><strong>No pudimos iniciar sesión</strong><span>{{ error() }}</span></div>
              </div>
            }

            <div class="login-fields">
              <label for="login-email">Correo institucional</label>
              <input
                id="login-email"
                type="email"
                name="correo"
                required
                email
                autocomplete="username"
                inputmode="email"
                autocapitalize="none"
                spellcheck="false"
                placeholder="nombre@sanjose.gob.pe"
                [(ngModel)]="correo"
                (ngModelChange)="clearError()">

              <label for="login-password">Contraseña</label>
              <div class="password-field">
                <input
                  #passwordInput
                  id="login-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  required
                  autocomplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  [(ngModel)]="password"
                  (ngModelChange)="clearError()"
                  (keydown)="detectCapsLock($event)"
                  (keyup)="detectCapsLock($event)">
                <button
                  type="button"
                  class="password-toggle"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="showPassword()"
                  (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) {
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.5 10.5 0 0 1 12 4c5.5 0 9 5.5 9 5.5a16 16 0 0 1-2.3 2.9M6.2 6.2C4.1 7.7 3 9.5 3 9.5S6.5 15 12 15c1 0 2-.2 2.8-.5"/></svg>
                  } @else {
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                  }
                </button>
              </div>
              @if (capsLock()) { <p class="field-hint" aria-live="polite">Bloq Mayús está activado.</p> }
            </div>

            <button class="btn login-submit" [disabled]="busy() || form.invalid">
              @if (busy()) { <span class="button-spinner" aria-hidden="true"></span> }
              <span>{{ busy() ? 'Verificando acceso…' : 'Ingresar al archivo' }}</span>
              @if (!busy()) {
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
              }
            </button>

            <p class="login-help">¿No tienes acceso? Solicita una cuenta al administrador del Archivo Municipal.</p>
          </form>
          <p class="login-footer">Acceso exclusivo para personal autorizado</p>
        </div>
      </section>
    </main>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  correo = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly capsLock = signal(false);

  login(form: NgForm) {
    if (this.busy() || form.invalid) return;
    this.busy.set(true);
    this.error.set('');

    this.auth.login({ correo: this.correo.trim().toLowerCase(), password: this.password }).subscribe({
      next: () => {
        this.busy.set(false);
        const target = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(target?.startsWith('/') && !target.startsWith('//') ? target : '/buscar');
      },
      error: (response: { status?: number }) => {
        this.busy.set(false);
        this.error.set(
          response.status === 0
            ? 'No hay conexión con el servidor. Verifica que el backend esté encendido e inténtalo nuevamente.'
            : response.status === 401
              ? 'El correo o la contraseña no coinciden. Revisa los datos e inténtalo otra vez.'
              : 'El acceso no está disponible en este momento. Inténtalo nuevamente en unos minutos.'
        );
        this.password = '';
        queueMicrotask(() => this.passwordInput()?.nativeElement.focus());
      }
    });
  }

  clearError() {
    if (this.error()) this.error.set('');
  }

  detectCapsLock(event: KeyboardEvent) {
    this.capsLock.set(event.getModifierState('CapsLock'));
  }
}
