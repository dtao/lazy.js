require "json"
require "uglifier"

def package_info
  JSON.parse(File.read('package.json'))
end

def update_json(file_path, updates)
  json = JSON.parse(File.read(file_path))
  json.merge!(updates)
  File.write(file_path, JSON.pretty_generate(json))
end

def format_options(options)
  options.map { |key, value| "--#{key} #{value}" }.join(" ")
end

file "lazy.min.js" => [ "lazy.js" ] do |task|
  File.open(task.name, 'w') { |f|
    content = task.prerequisites.map { |prereq|
      if File.exist?(prereq)
        File.read(prereq)
      elsif Rake::Task[prereq].nil?
        raise "Prerequisite #{prereq} does not exist."
      end
    }.compact.join("\n")
    f.write Uglifier.new.compile(content)
  }
end

desc "Concat and uglify JavaScript"
task :uglify => [ "lazy.min.js" ]

desc "Update the library version in package.json, bower.json, and component.json"
task :update_version do
  if (version = ENV['VERSION']).nil?
    puts "Set the VERSION environment variable for this Rake task."
    exit
  end

  update_json('package.json', { 'version' => version })
  update_json('bower.json', { 'version' => version })
  update_json('component.json', { 'version' => version })
end

desc "Setup symbolic links to lazy.js, etc. for project site"
task :symlinks do
  sh <<-BASH
    cd site/source/javascripts/lib
    ln -s ../../../../lazy.js lazy.js
    ln -s ../../../../lazy.browser.js lazy.browser.js
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
