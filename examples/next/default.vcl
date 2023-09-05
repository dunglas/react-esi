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

sub vcl_pipe {
    if (req.http.upgrade) {
        set bereq.http.upgrade = req.http.upgrade;
        set bereq.http.connection = req.http.connection;
    }
}