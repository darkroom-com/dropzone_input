# Dropzone Input

A Rails helper and Stimulus Controller that makes adding dropzone to a Rails form dead simple.

```erb
<%= form_with(model: User.new) do |form| %>
  <%= dropzone form, :image,
    file_success_event: 'USER_FILE_UPLOADED',
    file_progress_event: 'USER_FILE_PROGRESS',
    queue_complete_event: 'USER_FILE_UPLOAD_DONE' %>
<% end %>
```

*NOTE:* This was built for the specific use in https://darkroom.tech and many of the pieces (like
specific styles, etc) will be non-configurable at the moment. We will work to generalize this over
time and *pull requests are welcome* and will be reviewed quickly.

## Installation

Add to your Gemfile.

```ruby
gem 'dropzone_input'
```

```sh
bundle install
```

Add Javascript dependencies.

```
yarn add dropzone # If you don't already have this
yarn add @darkroom-com/dropzone-input
```

Register Stimulus controller. By default in Rails, this is in `controllers/index.js`.

```js
import DropzoneController from '@darkroom-com/dropzone-input';

application.register('dropzone', DropzoneController);
```

## Development

To develop this locally you can update your Gemfile to

```ruby
gem 'dropzone_input', path: 'PATH_TO_PROJECT'
```

In this project run

```sh
yarn link
```

In your app project run

```sh
yarn link @darkroom-com/dropzone-input
```

To auto-recompile this project, run

```sh
yarn run dev
```
