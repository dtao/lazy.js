###
# Helpers
###

# Syntax highlighting example taken straight from Redcarpet project README:
# https://github.com/vmg/redcarpet
class HTMLwithPygments < Redcarpet::Render::HTML
  def block_code(code, language)
    Pygments.highlight(code, :lexer => language)
  end
end

helpers do
  def version
    @version ||= JSON.parse(File.read(path_to_file('package.json')))['version']
  end

  def readme
    @readme ||= File.read(path_to_file('README.md'))
  end

  def spec_files
    @spec_files ||= Dir.glob(path_to_file('site/source/javascripts/lib/spec/*_spec.js')).map(&File.method(:basename))
  end

  def path_to_file(relative_path)
    File.join(File.dirname(__FILE__), '..', *relative_path.split('/'))
  end

  # I would much prefer to just have a partial called "_about.md.erb", but see this:
  # https://github.com/middleman/middleman/issues/963
  def render_markdown(source)
    puts markdown().inspect
    Redcarpet::Markdown.new(HTMLwithPygments, markdown()).render(source)
  end
end

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

set :markdown_engine, :redcarpet
set :markdown, :fenced_code_blocks => true, :smartypants => true

configure :build do
  activate :minify_css
end
