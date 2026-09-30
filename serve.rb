require 'webrick'

class NoSendfileHandler < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, root)
    super(server)
    @root = File.expand_path(root)
  end

  def do_GET(req, res)
    path = req.path == '/' ? '/index.html' : req.path
    file_path = File.join(@root, path)

    if File.file?(file_path)
      res.status = 200
      if file_path.end_with?('.html')
        res['Content-Type'] = 'text/html; charset=utf-8'
      elsif file_path.end_with?('.css')
        res['Content-Type'] = 'text/css'
      elsif file_path.end_with?('.js')
        res['Content-Type'] = 'application/javascript'
      elsif file_path.end_with?('.json')
        res['Content-Type'] = 'application/json'
      elsif file_path.end_with?('.png')
        res['Content-Type'] = 'image/png'
      elsif file_path.end_with?('.jpg') || file_path.end_with?('.jpeg')
        res['Content-Type'] = 'image/jpeg'
      elsif file_path.end_with?('.svg')
        res['Content-Type'] = 'image/svg+xml'
      elsif file_path.end_with?('.webp')
        res['Content-Type'] = 'image/webp'
      else
        res['Content-Type'] = 'application/octet-stream'
      end
      # Read binary data into memory so WEBrick sends via socket write instead of sendfile
      res.body = File.binread(file_path)
    else
      res.status = 404
      res.body = "File not found"
    end
  end
end

root_dir = ARGV[0] || File.join(File.dirname(__FILE__), 'public')
server = WEBrick::HTTPServer.new(
  Port: 3000,
  BindAddress: '0.0.0.0',
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::INFO),
  AccessLog: [[$stderr, WEBrick::AccessLog::COMBINED_LOG_FORMAT]]
)

server.mount('/', NoSendfileHandler, root_dir)

trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }

server.start
