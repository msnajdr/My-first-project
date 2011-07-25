# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.http import  HttpResponse
import json
#from django.http import HttpResponseRedirect, HttpResponse,Http404
#from django.core.servers.basehttp import FileWrapper
#from django.core.urlresolvers import reverse

def main(request):
    print 'test request method:',request.method
    print request.__dict__
    return render_to_response('mstest/main.html',
                              {},
                              context_instance=RequestContext(request))
    
def run(request):
    connections = json.loads(request.GET['connections'])
    modules = json.loads(request.GET['modules'])
    print '--------------------'
    print connections
    print modules
    print '--------------------'
    return HttpResponse(json.dumps({'name':[1,2,3,4]}),mimetype="application/json")