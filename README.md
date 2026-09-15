# Reproduction: `FormValueControl` ignores `updateOn` in Reactive and Template-Driven Forms

This repository reproduces an issue in `@angular/forms` (Angular v22.1.x) where custom controls implementing Signal Forms `FormValueControl<T>` (without a legacy `ControlValueAccessor`) ignore the `updateOn` configuration (`'blur'` or `'submit'`) when bound to Reactive Forms (`FormControl`, `FormGroup`) or Template-Driven Forms (`[(ngModel)]` with `[ngModelOptions]`).

## How to Reproduce

### 1. Automated Unit Tests

Run the unit tests with Vitest:

```bash
npm test -- --watch=false
```

In `src/app/app.spec.ts`:

- `delays updating FormControl value until blur for native input when updateOn is blur` **PASSES** (native `<input>` with `DefaultValueAccessor` respects `updateOn: 'blur'`).
- `delays updating FormControl value until blur for FormValueControl when updateOn is blur` **FAILS** (`FormControl.value` is updated immediately on input before blur).
- `delays updating FormControl value until submit for FormValueControl when updateOn is submit` **FAILS** (`FormControl.value` is updated immediately on input before form submission).
- `delays updating ngModel until blur for FormValueControl when updateOn is blur` **FAILS** (`ngModel` signal is updated immediately on input before blur).

### 2. Interactive Browser Demo

Run the development server:

```bash
npm start
```

Open `http://localhost:4200/` and type into the inputs side-by-side. The native `<input>` controls defer updating `control.value` until blur or submit as configured, whereas `<app-signal-input>` (`FormValueControl<string>`) updates the bound form control on every keystroke.

## Root Cause Analysis in `@angular/forms`

For controls with a `ControlValueAccessor`, `setUpControlValueAccessor` in `@angular/forms` wires up `setUpViewChangePipeline` and `setUpBlurPipeline`:

```ts
function setUpViewChangePipeline(control, dir) {
  dir.valueAccessor.registerOnChange((newValue) => {
    control._pendingValue = newValue;
    control._pendingChange = true;
    control._pendingDirty = true;
    if (control.updateOn === 'change') updateControl(control, dir);
  });
}

function setUpBlurPipeline(control, dir) {
  dir.valueAccessor.registerOnTouched(() => {
    control._pendingTouched = true;
    if (control.updateOn === 'blur' && control._pendingChange) updateControl(control, dir);
    if (control.updateOn !== 'submit') control.markAsTouched();
  });
}
```

However, when a component implements `FormValueControl<T>` without `ControlValueAccessor`, `NgControl.ngControlCreate` (`isCustomControlBased = true`) bypasses `setUpControlValueAccessor` and instead registers listeners directly on the custom control model and output:

```ts
host.listenToCustomControlModel((value) => {
  this.control?.setValue(value, {
    emitModelToViewChange: false,
  });
  this.control?.markAsDirty();
  this.viewToModelUpdate(value);
});
host.listenToCustomControlOutput('touch', () => {
  this.control?.markAsTouched();
});
```

Because `listenToCustomControlModel` unconditionally calls `this.control?.setValue(value)` and `this.viewToModelUpdate(value)` without checking `this.control.updateOn` or tracking `_pendingValue` / `_pendingChange`, both `updateOn: 'blur'` and `updateOn: 'submit'` are ignored.
