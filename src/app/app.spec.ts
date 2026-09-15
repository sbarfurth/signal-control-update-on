import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

function typeIntoInput(input: HTMLInputElement | null, text: string): void {
  if (!input) {
    throw new Error('Input element not found');
  }
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function blurInput(input: HTMLInputElement | null): void {
  if (!input) {
    throw new Error('Input element not found');
  }
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

describe('FormValueControl updateOn reproduction', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let rootEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    await fixture.whenStable();
    const el = fixture.nativeElement;
    if (!(el instanceof HTMLElement)) {
      throw new Error('Expected HTMLElement');
    }
    rootEl = el;
  });

  it('delays updating FormControl value until blur for native input when updateOn is blur', () => {
    const inputs = rootEl.querySelectorAll<HTMLInputElement>('input.native-input');
    const nativeBlurInput = inputs.item(0);

    typeIntoInput(nativeBlurInput, 'hello');
    TestBed.tick();

    // Before blur, native CVA control respects updateOn: 'blur'
    expect(app.nativeBlurControl.value).toBe('');

    blurInput(nativeBlurInput);
    TestBed.tick();

    expect(app.nativeBlurControl.value).toBe('hello');
  });

  it('delays updating FormControl value until blur for FormValueControl when updateOn is blur', () => {
    const customInputs = rootEl.querySelectorAll<HTMLInputElement>('app-signal-input input');
    const signalBlurInput = customInputs.item(0);

    typeIntoInput(signalBlurInput, 'hello');
    TestBed.tick();

    // BUG: NgControl.ngControlCreate calls control.setValue() immediately on
    // valueChange without checking control.updateOn === 'blur'.
    expect(app.signalBlurControl.value).toBe('');
  });

  it('delays updating FormControl value until submit for FormValueControl when updateOn is submit', () => {
    const customInputs = rootEl.querySelectorAll<HTMLInputElement>('app-signal-input input');
    const signalSubmitInput = customInputs.item(1);

    typeIntoInput(signalSubmitInput, 'hello');
    blurInput(signalSubmitInput);
    TestBed.tick();

    // BUG: NgControl.ngControlCreate calls control.setValue() immediately on
    // valueChange without checking control.updateOn === 'submit'.
    expect(app.submitForm.controls.signalSubmit.value).toBe('');
  });

  it('delays updating ngModel until blur for FormValueControl when updateOn is blur', () => {
    const customInputs = rootEl.querySelectorAll<HTMLInputElement>('app-signal-input input');
    const signalNgModelInput = customInputs.item(2);

    typeIntoInput(signalNgModelInput, 'hello');
    TestBed.tick();

    // BUG: NgModel with FormValueControl ignores [ngModelOptions]="{ updateOn: 'blur' }"
    expect(app.ngModelSignalValue()).toBe('');
  });
});
