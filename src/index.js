import { Controller } from "@hotwired/stimulus";
import { DirectUpload } from "@rails/activestorage";
import Dropzone from "dropzone";
import Cropper from 'cropperjs';
import { tiffToPNG } from "./tiff";

const DEFAULT_PARALLEL_UPLOADS = 2;
const DEFAULT_MAX_THUMBNAIL_FILE_SIZE = 10;
const DEFAULT_THUMBNAIL_HEIGHT = 120;
const DEFAULT_THUMBNAIL_WIDTH = 120;

Dropzone.autoDiscover = false;

class DropzoneController extends Controller {
  static targets = ["input"];

  connect() {
    if (this.dropzone === undefined) {
      const config = {
        url: this.url,
        headers: this.headers,
        acceptedFiles: this.acceptedFiles,
        maxFiles: this.maxFiles,
        maxFilesize: this.maxFileSize,
        autoQueue: false,
        parallelUploads: this.parallelUploads,
        maxThumbnailFilesize: this.maxThumbnailFileSize,
        thumbnailWidth: this.thumbnailWidth,
        thumbnailHeight: this.thumbnailHeight,
      }

      const previewTemplateElement =this.element.querySelector('template#preview');
      if (previewTemplateElement) {
        config.previewTemplate = previewTemplateElement.innerHTML;
      }

      this.queue = [];
      this.uploadsInProgress = 0;
      this.dropzone = new Dropzone(this.element, config);
      this.bindEvents();
    }

    this.hideFileInput();
    this.bindFileDrop();
  }

  hideFileInput() {
    this.inputTarget.classList.add("hidden");
  }

  bindEvents() {
    this.dropzone.on("addedfile", file =>
      setTimeout(() => this.handleFileAdded(file), 500)
    );
    this.dropzone.on(
      "removedfile",
      file => this.handleFileRemoved(file)
    );
    this.dropzone.on("success", file => this.handleFileSuccess(file));
    this.dropzone.on("queuecomplete", () => this.handleQueueComplete());
    this.dropzone.on("drop", event => this.handleFileDropped(event));
    this.dropzone.on(
      "uploadprogress",
      (file, progress) => this.handleFileProgress(file, progress)
    );
    this.dropzone.on("thumbnail", this.handleThumbnail);
  }

  fileAdded(file) {
    if (this.croppable && !file.cropped) { return; }

    this.dispatchEvent(this.fileAddedEvent, { detail: { file: file }});

    const controller = new DirectUploadController(this, file);
    this.queue.push(controller);
    this.runUploadQueue();
  }

  handleFileAdded(file) {
    if (file.accepted) {
      if (this.fileExists(file)) {
        this.dropzone.removeFile(file);
        return;
      }

      if (file.type === "image/tiff") {
        this.createTiffThumbnail(file, file => this.fileAdded(file));
      } else {
        this.fileAdded(file);
      }
    }
  }

  handleThumbnail = (file) => {
    if (!this.croppable || file.cropped) { return; }

    const fileName = file.name;
    this.dropzone.removeFile(file);

    function dataURItoBlob(dataURI) {
      var byteString = atob(dataURI.split(',')[1]);
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: 'image/jpeg' });
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const container = this.element.querySelector('.dz-message');
      container.remove();
      const div = document.createElement('div');
      const button = document.createElement('a');
      button.innerText = 'Save crop';
      button.href = '#';
      button.classList.add('bg-blue-500', 'rounded-b', 'px-4', 'py-2', 'absolute', 'inset-x-0', 'text-center')
      const img = document.createElement('img');
      img.src = reader.result;
      div.appendChild(img);
      div.appendChild(button);
      this.element.appendChild(div);

      const cropper = new Cropper(img, {
        aspectRatio: 1
      });
      button.addEventListener('click', (event) => {
        event.preventDefault();

        const blob = cropper.getCroppedCanvas().toDataURL();
        const newFile = dataURItoBlob(blob);
        newFile.cropped = true;
        newFile.name = fileName;
        cropper.destroy();
        div.remove();

        this.dropzone.addFile(newFile);
      });
    }
    reader.readAsDataURL(file);
  }

  handleFileDropped(event) {
    this.dispatchEvent(this.fileDropEvent, { dataTransfer: event });
  }

  handleFileSuccess(file) {
    this.dispatchEvent(this.fileSuccessEvent, { detail: { file: file }});
    this.uploadsInProgress--;
    this.runUploadQueue();
  }

  handleFileProgress(file, progress) {
    this.dispatchEvent(this.fileProgressEvent, { detail: { file: file, progress: progress }});
  }

  handleFileRemoved(file) {
    if (file.controller) {
      if (file.controller.xhr) {
        file.controller.xhr.abort();
        this.uploadsInProgress--;
      } else {
        this.removeFromQueue(file);
      }

      file.controller.removeHiddenInput();

      this.dispatchEvent(this.fileRemovedEvent, { detail: { file: file }});
      this.runUploadQueue();
    }
  }

  handleQueueComplete() {
    this.dispatchEvent(this.queueCompleteEvent);
  }

  handleFileDropDragEnter() {
    if (this.fileDropOver) {
      this.fileDropOver.classList.remove("hidden");
    }
  }

  handleFileDropDragLeave() {
    if (this.fileDropOver) {
      this.fileDropOver.classList.add("hidden");
    }
  }

  createTiffThumbnail(file, callback) {
    tiffToPNG(file, (dataURL) => {
      const img = document.createElement("img");
      img.onload = () => {
        const fileObj = { width: img.width, height: img.height, dataURL: dataURL };

        this.dropzone.createThumbnailFromUrl(
          fileObj,
          this.dropzone.options.thumbnailWidth,
          this.dropzone.options.thumbnailHeight,
          this.dropzone.options.thumbnailMethod,
          true,
          (thumbnail) => {
            this.dropzone.emit("thumbnail", file, thumbnail);

            if (callback != null) {
              callback(file);
            }
          }
        );
      };
      img.src = dataURL;
    });
  }

  resetDragCounter() {
    this.dragCounter = 0;
    this.handleFileDropDragLeave();
  }

  bindFileDrop() {
    this.dragCounter = 0;

    if (this.fileDropId) {
      const fileDrop = document.getElementById(this.fileDropId);
      fileDrop.addEventListener("dragover", e => e.preventDefault());
      fileDrop.addEventListener("dragenter", e => {
        e.preventDefault();
        if (this.dragCounter === 0) {
          this.handleFileDropDragEnter();
        }
        this.dragCounter++;
      });
      fileDrop.addEventListener("dragleave", () => {
        this.dragCounter--;
        if (this.dragCounter === 0) {
          this.handleFileDropDragLeave();
        }
      });
      fileDrop.addEventListener("drop", e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length) {
          this.dropzone.drop({ dataTransfer: e.dataTransfer });
        }
        this.resetDragCounter();
      });

      this.fileDropOver = document.getElementById(this.fileDropOverId);
    }
  }

  dispatchEvent(eventName, info=null) {
    if (eventName) {
      const event = new CustomEvent(eventName, info);
      window.dispatchEvent(event);
    }
  }

  fileExists(theFile) {
    const files = this.dropzone.files.filter(file => (file.name == theFile.name && file.size == theFile.size));
    return files.length > 1;
  }

  removeFromQueue(file) {
    this.queue = this.queue.filter(controller => (controller.file.upload.uuid !== file.upload.uuid));
  }

  runUploadQueue() {
    this.queue.forEach((controller, index, queue) => {
      if (this.uploadsInProgress < this.parallelUploads) {
        this.dispatchEvent(this.fileStartEvent, { detail: { file: controller.file }});
        controller.start();
        queue.splice(index, 1);
        this.uploadsInProgress++;
      }
    });
  }

  get headers() {
    return {
      "X-CSRF-Token": this.csrfToken
    };
  }

  get csrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.content : null;
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

  get fileAddedEvent() {
    return this.data.get("file-added-event");
  }

  get fileDropEvent() {
    return this.data.get("file-drop-event");
  }

  get fileStartEvent() {
    return this.data.get("file-start-event");
  }

  get fileSuccessEvent() {
    return this.data.get("file-success-event");
  }

  get fileProgressEvent() {
    return this.data.get("file-progress-event");
  }

  get fileRemovedEvent() {
    return this.data.get("file-removed-event");
  }

  get queueCompleteEvent() {
    return this.data.get("queue-complete-event");
  }

  get fileDropId() {
    return this.data.get("file-drop-id") || null;
  }

  get fileDropOverId() {
    return this.data.get("file-drop-over-id") || null;
  }

  get parallelUploads() {
    return this.data.get("parallel-uploads") || DEFAULT_PARALLEL_UPLOADS;
  }

  get maxThumbnailFileSize() {
    return this.data.get("max-thumbnail-file-size") || DEFAULT_MAX_THUMBNAIL_FILE_SIZE;
  }

  get thumbnailHeight() {
    return this.data.get('thumbnail-height') || DEFAULT_THUMBNAIL_HEIGHT;
  }

  get thumbnailWidth() {
    return this.data.get('thumbnail-width') || DEFAULT_THUMBNAIL_WIDTH;
  }

  get croppable() {
    return this.data.get('croppable') === 'true';
  }
}

class DirectUploadController {
  constructor(controller, file) {
    this.directUpload = new DirectUpload(file, controller.url, this);
    this.controller = controller;
    this.file = file;
    this.file.controller = this;
  }

  start() {
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

  cancel() {
    this.controller.dropzone.removeFile(this.file);
  }

  cancelAll() {
    this.controller.dropzone.removeAllFiles(true);
  }

  directUploadWillStoreFileWithXHR(xhr) {
    this.bindProgressEvent(xhr);
    this.emitDropzoneUploading();
  }

  bindProgressEvent(xhr) {
    const file = this.file;

    this.xhr = xhr;
    this.xhr.upload.addEventListener("progress", event => {
      const progress = parseFloat(event.loaded / event.total) * 100;
      file.upload.bytesSent = event.loaded;
      file.upload.progress = progress;
      this.emitDropzoneProgress(progress);
      this.uploadRequestDidProgress(progress);
    });
  }

  uploadRequestDidProgress(progress) {
    const progressElement = this.file.previewTemplate.querySelector(".dz-upload");

    if (!progressElement) { return; }

    progressElement.style.width = `${progress}%`;
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

  emitDropzoneProgress(progress) {
    this.controller.dropzone.emit("uploadprogress", this.file, progress);
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
