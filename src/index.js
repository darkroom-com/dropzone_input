import { Controller } from "stimulus";
import { DirectUpload } from "@rails/activestorage";
import Dropzone from "dropzone";

Dropzone.autoDiscover = false;

class DropzoneController extends Controller {
  static targets = ["input"];

  connect() {
    this.dropzone = new Dropzone(this.element, {
      url: this.url,
      headers: this.headers,
      acceptedFiles: this.acceptedFiles,
      maxFiles: this.maxFiles,
      maxFilesize: this.maxFileSize,
      autoQueue: false
    });

    this.hideFileInput();
    this.bindEvents();
  }

  hideFileInput() {
    this.inputTarget.disabled = true;
    this.inputTarget.classList.add("hidden");
  }

  bindEvents() {
    this.dropzone.on("addedfile", file =>
      setTimeout(() => this.onFileAdded(file), 500)
    );
    this.dropzone.on(
      "removedfile",
      file => file.controller && file.controller.removeHiddenInput()
    );
    this.dropzone.on(
      "canceled",
      file => file.controller && file.controller.xhr.abort()
    );
    this.dropzone.on("success", file => this.handleFileSuccess(file));
    this.dropzone.on("queuecomplete", () => this.handleQueueComplete());
  }

  handleFileSuccess(file) {
    if (this.fileSuccessEvent) {
      const event = new CustomEvent(this.fileSuccessEvent, {
        detail: { file: file }
      });
      window.dispatchEvent(event);
    }
  }

  handleQueueComplete() {
    if (this.queueCompleteEvent) {
      const event = new CustomEvent(this.queueCompleteEvent);
      window.dispatchEvent(event);
    }
  }

  onFileAdded(file) {
    if (file.accepted) {
      const controller = new DirectUploadController(this, file);
      controller.start();
    }
  }

  get headers() {
    return {
      "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
    };
  }

  get url() {
    return this.inputTarget.dataset.directUploadUrl;
  }

  get acceptedFiles() {
    return this.data.get("accepted-files") || "image/*";
  }

  get maxFiles() {
    return this.data.get("max-files") || null;
  }

  get maxFileSize() {
    return this.data.get("max-file-size") || null;
  }

  get fileSuccessEvent() {
    return this.data.get("file-success-event");
  }

  get queueCompleteEvent() {
    return this.data.get("queue-complete-event");
  }
}

class DirectUploadController {
  constructor(controller, file) {
    this.directUpload = new DirectUpload(file, controller.url, this);
    this.controller = controller;
    this.file = file;
  }

  start() {
    this.file.controller = this;
    this.hiddenInput = this.createHiddenInput();
    this.directUpload.create((error, attributes) => {
      if (error) {
        this.removeHiddenInput();
        this.emitDropzoneError(error);
      } else {
        this.hiddenInput.value = attributes.signed_id;
        this.file.signed_id = attributes.signed_id;
        this.emitDropzoneSuccess();
      }
    });
  }

  directUploadWillStoreFileWithXHR(xhr) {
    this.bindProgressEvent(xhr);
    this.emitDropzoneUploading();
  }

  bindProgressEvent(xhr) {
    this.xhr = xhr;
    this.xhr.upload.addEventListener("progress", event =>
      this.uploadRequestDidProgress(event)
    );
  }

  uploadRequestDidProgress(event) {
    const progress = (event.loaded / event.total) * 100;
    this.file.previewTemplate.querySelector(
      ".dz-upload"
    ).style.width = `${progress}%`;
  }

  createHiddenInput() {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = this.controller.inputTarget.name;
    this.controller.inputTarget.parentNode.insertBefore(
      input,
      this.controller.inputTarget.nextSibling
    );

    return input;
  }

  removeHiddenInput() {
    if (this.hiddenInput && this.hiddenInput.parentNode) {
      this.hiddenInput.parentNode.removeChild(this.hiddenInput);
    }
  }

  emitDropzoneUploading() {
    this.file.status = Dropzone.UPLOADING;
    this.controller.dropzone.emit("processing", this.file);
  }

  emitDropzoneSuccess() {
    this.file.status = Dropzone.SUCCESS;
    this.controller.dropzone.emit("success", this.file);
    this.controller.dropzone.emit("complete", this.file);
  }

  emitDropzoneError(error) {
    this.file.status = Dropzone.ERROR;
    this.controller.dropzone.emit("error", this.file, error);
    this.controller.dropzone.emit("complete", this.file);
  }
}

export default DropzoneController;
