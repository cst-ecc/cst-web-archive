# Gateway applicatif CST / CSMO.
# Il ne contient ni le frontend ni le backend : il route uniquement les flux.
FROM nginx:1.28-alpine

COPY default.conf /etc/nginx/conf.d/default.conf
COPY errors/maintenance.html /usr/share/nginx/html/maintenance.html
COPY errors/system-error.html /usr/share/nginx/html/system-error.html

EXPOSE 8080
