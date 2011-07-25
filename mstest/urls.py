from django.conf.urls.defaults import *
#from django.views.generic import DetailView, ListView
#from polls.models import Poll

urlpatterns = patterns('mstest.views',
    url(r'^$','main',name='mstest.main'),
    url(r'^run/$','run',name='mstest.run')
#    (r'^(?P<pk>\d+)/download/$','download'),
#    (r'^(?P<pk>\d+)/edit/$','edit'),
#    (r'^(?P<pk>\d+)/delete/$','delete'),
#    (r'^(?P<pk>\d+)/preview/$','preview'),
#    (r'^new/$','new'),
#    (r'^update/$','update')
)
