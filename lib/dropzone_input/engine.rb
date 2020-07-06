# frozen_string_literal: true

module DropzoneInput
  class Engine < ::Rails::Engine
    initializer 'dropzone_input.engine' do |_app|
      ActionView::Base.include DropzoneInput::Helpers
    end
  end
end
