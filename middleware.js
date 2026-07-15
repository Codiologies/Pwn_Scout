export default function middleware(request) {
  const url = new URL(request.url);

  // Check if the user is visiting a .vercel.app domain
  if (url.hostname.endsWith('.vercel.app')) {
    // Change the hostname to your custom domain
    url.hostname = 'pwnscout.guptasajal.com';
    
    // Perform a 301 Permanent Redirect to the new URL
    return Response.redirect(url.toString(), 301);
  }
}
