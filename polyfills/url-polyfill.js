class URLPolyfill {
  constructor(url, base) {
    if (typeof url !== 'string') {
      throw new TypeError('URL must be a string');
    }

    let fullUrl = url;
    if (base) {
      // Simple base URL resolution
      if (!url.startsWith('http')) {
        fullUrl = base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
      }
    }

    const parts = fullUrl.match(/^(https?:)\/\/([^/:]+)(?::(\d+))?(\/?[^?#]*)?(?:\?([^#]*))?(?:#(.*))?/);
    if (!parts) {
      throw new TypeError('Invalid URL format');
    }

    this.protocol = parts[1] || 'http:';
    this.hostname = parts[2] || '';
    this.port = parts[3] || '';
    this.pathname = parts[4] || '/';
    this.search = parts[5] ? `?${parts[5]}` : '';
    this.hash = parts[6] ? `#${parts[6]}` : '';
    this.host = this.hostname + (this.port ? `:${this.port}` : '');
    this.origin = `${this.protocol}//${this.host}`;
    this.href = fullUrl;
  }

  toString() {
    return this.href;
  }
}

global.URL = URLPolyfill;

