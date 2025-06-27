from livereload import Server

# Create a Server instance
server = Server()

# Watch for changes in your project files
server.watch('index.html')
server.watch('rapport-template.html')
server.watch('style.css')
server.watch('script.js')

# Serve the project on the default port (5500)
# Open http://localhost:5500 in your browser
server.serve(root='.', port=5500, open_url_delay=1) 