vcl 4.1;

backend node {
  .host = "node";
  .port = "3000";
}

sub vcl_recv {

    if (req.http.upgrade ~ "(?i)websocket") {
        return (pipe);
    }

  # Announce ESI support to Node (optional)
  set req.http.Surrogate-Capability = "key=ESI/1.0";
}

sub vcl_backend_response {
  # Enable ESI support
  if (beresp.http.Surrogate-Control ~ "ESI/1.0") {
    unset beresp.http.Surrogate-Control;
    set beresp.do_esi = true;
  }
}

sub vcl_backend_error {
    if (beresp.status == 400 && beresp.reason ~ "Bad signature") {
        set beresp.http.Content-Type = "text/html; charset=utf-8";
        synthetic("HTTP/1.1 400 Bad Request" + " " +
                  "<h1>Bad Request</h1><p>Bad signature. Please check your request and try again.</p>");
        return(deliver);
    }
    // Handle backend errors here
    set beresp.http.Content-Type = "text/html; charset=utf-8";
    set beresp.status = 503; // You can set a custom status code
    synthetic("HTTP/1.1 503 Service Unavailable" + " " +
              "<h1>Backend Error</h1><p>Something went wrong on our end. Please try again later.</p>");
    return(deliver);
}

sub vcl_pipe {
    if (req.http.upgrade) {
        set bereq.http.upgrade = req.http.upgrade;
        set bereq.http.connection = req.http.connection;
    }
}

sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Varnish-Cache = "HIT";
    } else {
        set resp.http.X-Varnish-Cache = "MISS";
    }

    return (deliver);
}