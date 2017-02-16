require "json"
require "uglifier"

def package_info
  JSON.parse(File.read('package.json'))
end

def update_json(file_path, updates)
  json = JSON.parse(File.read(file_path))
  json.merge!(updates)
  File.write(file_path, JSON.pretty_generate(json) + "\n")
end

def format_options(options)
  options.map { |key, value| "--#{key} #{value}" }.join(" ")
end

desc "Concat and uglify JavaScript"
task :build => [ 'lazy.js', 'lazy.browser.js' ] do |task|
  version = package_info['version']

  File.open('lazy.min.js', 'w') { |f|
    content = task.prerequisites.map { |prereq|
      if File.exist?(prereq)
        File.read(prereq)
      elsif Rake::Task[prereq].nil?
        raise "Prerequisite #{prereq} does not exist."
      end
    }.compact.join("\n")

    header = "/*! lazy.js #{version} (c)#{Time.now.year} Dan Tao @license MIT */"
    minified = Uglifier.new.compile(content)
    f.write(header + "\n" + minified + "\n")
  }
end

desc "Update the library version in package.json and component.json"
task :update_version do
  if (version = ENV['VERSION']).nil?
    puts "Set the VERSION environment variable for this Rake task."
    exit
  end

  update_json('package.json', { 'version' => version })
  update_json('component.json', { 'version' => version })
end

desc "Setup symbolic links to lazy.js, etc. for project site"
task :symlinks do
  sh <<-BASH
    cd site/source/javascripts/lib
    ln -s ../../../../lazy.js lazy.js
    ln -s ../../../../lazy.browser.js lazy.browser.js
    ln -s ../../../../lazy.min.js lazy.min.js
    ln -s ../../../../experimental/lazy.json.js lazy.json.js
    ln -s ../../../../experimental/lazy.es6.js lazy.es6.js
    ln -s ../../../../spec spec
  BASH
end

desc "Generate documentation using Autodoc"
task :generate_docs do
  sequence_types = [
    "Lazy",
    "Sequence",
    "ArrayLikeSequence",
    "ObjectLikeSequence",
    "StringLikeSequence",
    "StreamLikeSequence",
    "GeneratedSequence",
    "AsyncSequence",
    "Iterator",
    "AsyncHandle"
  ]

  options = {
    :namespaces => sequence_types.join(","),
    :template => "autodoc/index.html.mustache",
    :handlers => "autodoc/handlers.js",
    :partials => "autodoc/",
    :output => "site/build/docs",
    :'template-data' => "version:#{package_info['version']}"
  }

  sh "autodoc #{format_options(options)} lazy.js"
end
