type TextEntryCallbacks = {
  onUpdate: (value: string) => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

class DomBridge {
  private fileInput: HTMLInputElement;
  private textInput: HTMLInputElement;
  private activeCallbacks: TextEntryCallbacks | null = null;

  constructor() {
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".json,application/json";
    this.hideInput(this.fileInput);
    document.body.appendChild(this.fileInput);

    this.textInput = document.createElement("input");
    this.textInput.type = "text";
    this.textInput.autocomplete = "off";
    this.textInput.spellcheck = false;
    this.hideInput(this.textInput);
    document.body.appendChild(this.textInput);

    this.textInput.addEventListener("input", () => {
      this.activeCallbacks?.onUpdate(this.textInput.value);
    });
    this.textInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.commitText();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.cancelText();
      }
    });
    this.textInput.addEventListener("blur", () => {
      if (!this.activeCallbacks) {
        return;
      }
      queueMicrotask(() => {
        if (document.activeElement !== this.textInput && this.activeCallbacks) {
          this.commitText();
        }
      });
    });
  }

  private hideInput(input: HTMLInputElement) {
    input.setAttribute("aria-hidden", "true");
    input.tabIndex = -1;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
  }

  async pickJsonFile(): Promise<string | null> {
    return new Promise((resolve) => {
      this.fileInput.value = "";
      const onChange = async () => {
        this.fileInput.removeEventListener("change", onChange);
        const file = this.fileInput.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        resolve(await file.text());
      };
      this.fileInput.addEventListener("change", onChange);
      this.fileInput.click();
    });
  }

  downloadText(filename: string, contents: string) {
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  beginTextEntry(initialValue: string, callbacks: TextEntryCallbacks) {
    this.activeCallbacks = callbacks;
    this.textInput.value = initialValue;
    this.textInput.focus();
    this.textInput.setSelectionRange(initialValue.length, initialValue.length);
    callbacks.onUpdate(initialValue);
  }

  private commitText() {
    if (!this.activeCallbacks) {
      return;
    }
    const callbacks = this.activeCallbacks;
    const value = this.textInput.value;
    this.activeCallbacks = null;
    callbacks.onCommit(value);
  }

  private cancelText() {
    if (!this.activeCallbacks) {
      return;
    }
    const callbacks = this.activeCallbacks;
    this.activeCallbacks = null;
    callbacks.onCancel();
  }
}

export const domBridge = new DomBridge();
