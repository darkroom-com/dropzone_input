# frozen_string_literal: true

$LOAD_PATH.push File.expand_path('lib', __dir__)

# Maintain your gem's version:
require 'dropzone_input/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |spec|
  spec.name        = 'dropzone_input'
  spec.version     = DropzoneInput::VERSION
  spec.authors     = ['Trae Robrock']
  spec.email       = ['trobrock@gmail.com']
  spec.homepage    = 'https://github.com/darkroom-com/dropzone_input'
  spec.summary     = 'A rails helper to easily add Dropzone to forms.'
  spec.description = 'A rails helper to easily add Dropzone to forms.'
  spec.license     = 'MIT'

  spec.files = Dir['{app,config,lib}/**/*', 'MIT-LICENSE', 'Rakefile', 'README.md']

  spec.add_dependency 'rails', '>= 5', '< 7'
end
