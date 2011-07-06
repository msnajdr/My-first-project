# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
#from django.http import HttpResponseRedirect, HttpResponse,Http404
#from django.core.servers.basehttp import FileWrapper
#from django.core.urlresolvers import reverse

def main(request):
    print 'somtu'
    return render_to_response('mstest/main.html',
                              {},
                              context_instance=RequestContext(request))