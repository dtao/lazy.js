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
  def readme
    @readme ||= File.read(File.join(File.dirname(__FILE__), '..', 'README.md'))
  end

  # I would much prefer to just have a partial called "_about.md.erb", but see this:
  # https://github.com/middleman/middleman/issues/963
  def render_markdown(source)
    puts markdown().inspect
    Redcarpet::Markdown.new(HTMLwithPygments, markdown()).render(source)
  end
end

# Reload the browser automatically whenever files change
activate :livereload

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

set :markdown_engine, :redcarpet
set :markdown, :fenced_code_blocks => true, :smartypants => true

# Build-specific configuration
configure :build do
  # For example, change the Compass output style for deployment
  activate :minify_css

  # Minify Javascript on build
  activate :minify_javascript

  # Use relative URLs
  activate :relative_assets
end
