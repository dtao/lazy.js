# Take a Nokogiri HTML fragment and run its code blocks through Pygments.
def syntax_highlight!(fragment)
  fragment.css("pre > code").each do |node|
    language = node["class"] || "javascript"
    if language
      highlighted_html = Pygments.highlight(node.content, :lexer => language)
      replacement = Nokogiri::HTML::fragment(highlighted_html)
      node.parent.replace(replacement)
    end
  end
end

def simple_markdown(text)
  return "" if text.nil?
  @renderer ||= Redcarpet::Markdown.new(Redcarpet::Render::HTML)

  # HTML => Markdown
  html = @renderer.render(text)

  # Parse that HTML
  fragment = Nokogiri::HTML.fragment(html)

  # If it's just a single <p> element, let's strip out the <p>.
  if fragment.children.count == 1 && fragment.children[0].name =~ /^P$/i
    html = html[3..-4]

  # Otherwise, do syntax highlighting! (This might be a big fragment w/
  # examples and such.)
  else
    syntax_highlight!(fragment)
    html = fragment.inner_html
  end

  html.gsub(/\{@link ([^\.#}]+)?([\.#][^}]+)?\}/) do |match|
    file = $1 ? "#{$1}.html" : ""
    anchor = $2 ? "#" + $2[1..-1] : ""
    "<a class='internal-link' href='#{file}#{anchor}'><code>#{$1}#{$2}</code></a>"
  end
end

def normalize_methods!(methods)
  methods.each do |method_data|
    method_data["description"] = simple_markdown(method_data["description"])

    (params = method_data["params"]) && params.each do |param_data|
      param_data["type"] = param_data["type"]["names"].join("|")
      param_data["description"] = simple_markdown(param_data["description"])
    end
    method_data["params"] = { :list => params } unless params.nil? || params.empty?

    (returns = method_data["returns"]) && returns.each do |returns_data|
      returns_data["type"] = returns_data["type"]["names"].join("|")
      returns_data["description"] = simple_markdown(returns_data["description"])
    end
    method_data["returns"] = { :list => returns } unless returns.nil? || returns.empty?
  end

  methods.sort! { |x, y| x["name"] <=> y["name"] }
end

namespace :compile do
  desc "Compile everything (the library, the site, and the API docs)"
  task :all => [:site, :docs]

  desc "Compile the homepage (currently hosted on GitHub pages)"
  task :site do
    require "mustache"
    require "nokogiri"
    require "pygments"
    require "redcarpet"

    markdown = File.read("README.md")

    # Translate to HTML w/ Redcarpet.
    renderer = Redcarpet::Markdown.new(Redcarpet::Render::HTML, :fenced_code_blocks => true)
    raw_html = renderer.render(markdown)

    # Parse HTML using Nokogiri.
    fragment = Nokogiri::HTML::fragment(raw_html)

    # Find the Travis build status icon and add GitHub and Twitter buttons.
    travis_image = fragment.css("a[href='https://travis-ci.org/dtao/lazy.js']").first
    travis_image.parent["class"] = "sharing"
    share_fragment = Nokogiri::HTML::fragment(File.read(File.join("site", "share.html")))
    travis_image.add_next_sibling(share_fragment)

    # Add IDs to section headings.
    fragment.css("h1,h2").each do |node|
      title = node.content
      node["id"] = title.downcase.gsub(/\s+/, "-").gsub(/[^\w\-]/, "")
    end

    # Do syntax highlighting w/ Pygments.
    syntax_highlight!(fragment)

    # Inject README into Mustache template.
    Mustache.template_path = "site/templates"

    class SiteTemplate < Mustache; end
    final_html = SiteTemplate.render({
      :readme => fragment.inner_html,
      :benchmark_sections => [
        { :id => "10", :label => "10 elements", :selected => true },
        { :id => "100", :label => "100 elements" },
        { :id => "other", :label => "Other" }
      ]
    })

    # Finally, write the rendered result to index.html.
    File.open("index.html", "w") do |f|
      f.write(final_html)
    end
  end

  desc "Compile the API docs"
  task :docs do
    require "json"
    require "mustache"
    require "nokogiri"
    require "pygments"
    require "redcarpet"

    # Get a JSON representation of our JSDoc comments.
    classes = JSON.parse(`jsdoc lib --recurse --template templates/lazy`)

    # OK, I want to massage this data a little bit...
    classes.each_with_index do |class_data, index|
      normalize_methods!([class_data["constructor"]])
      normalize_methods!(class_data["instanceMethods"])
      normalize_methods!(class_data["staticMethods"])
      class_data["methods"] = class_data["staticMethods"] + class_data["instanceMethods"]
      class_data["anyStaticMethods"] = class_data["staticMethods"].any?
      class_data["anyInstanceMethods"] = class_data["instanceMethods"].any?
    end

    Mustache.template_path = "docs/templates"

    # Now HERE is some hacky malarkey: I'm going to read preamble.js directly,
    # strip out the comment syntax, and convert to Markdown MYSELF.
    #
    # Just try and stop me.
    preamble = File.read("lib/preamble.js").gsub(/^[\/ ]\*[\/ ]?/, "")
    preamble_html = simple_markdown(preamble)

    class DocsTemplate < Mustache; end
    docs_index_html = DocsTemplate.render({
      :classes  => classes,
      :preamble => preamble_html
    })

    File.open("docs/index.html", "w") do |f|
      f.write(docs_index_html)
    end

    class ClassTemplate < Mustache; end
    classes.each do |class_data|
      html = ClassTemplate.render(class_data)

      document = Nokogiri::HTML(html)
      syntax_highlight!(document)

      File.open("docs/#{class_data['name']}.html", "w") do |f|
        f.write(document.inner_html)
      end
    end
  end
end
