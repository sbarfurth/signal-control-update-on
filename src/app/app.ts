import { Component, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-signal-input',
  template: `
    <input
      class="custom-input"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="touch.emit()"
      placeholder="Type here (FormValueControl)..."
    />
  `,
  styles: `
    .custom-input {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }
  `,
})
export class SignalInput implements FormValueControl<string> {
  readonly value = model('');
  readonly touch = output<void>();

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.value.set(event.target.value);
    }
  }
}

@Component({
  imports: [FormsModule, ReactiveFormsModule, SignalInput],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // 1. Reactive FormControl with updateOn: 'blur'
  readonly signalBlurControl = new FormControl('', { updateOn: 'blur', nonNullable: true });
  readonly nativeBlurControl = new FormControl('', { updateOn: 'blur', nonNullable: true });

  // 2. Reactive FormGroup with updateOn: 'submit'
  readonly submitForm = new FormGroup(
    {
      signalSubmit: new FormControl('', { nonNullable: true }),
      nativeSubmit: new FormControl('', { nonNullable: true }),
    },
    { updateOn: 'submit' },
  );

  // 3. Template-driven ngModel with updateOn: 'blur'
  readonly ngModelSignalValue = signal('');
  readonly ngModelNativeValue = signal('');

  protected onSubmit(): void {
    // Form submission triggers syncPendingControls on the FormGroupDirective
  }
}
