# frozen_string_literal: true

module DropzoneInput
  module Helpers
    def dropzone(form, field, options = {}) # rubocop:disable Style/OptionHash
      class_list = options.delete(:class)
      class_list = ['dropzone', class_list].compact.join(' ')

      options[:max_file_size] /= 1.megabyte if options[:max_file_size]

      data = {
        controller: 'dropzone',
        dropzone_accepted_files: ActiveStorage.variable_content_types.join(',')
      }
      %i( max_files max_file_size file_success_event queue_complete_event ).each do |key|
        data["dropzone_#{key}".to_sym] = options.delete(key) if options.key?(key)
      end

      content_tag :div, options.merge(class: class_list, data: data) do
        render 'dropzone_input/dropzone', form: form, field: field do
          block_given? ? yield : render('dropzone_input/default_content')
        end
      end
    end
  end
end
