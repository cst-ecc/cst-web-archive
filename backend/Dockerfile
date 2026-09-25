FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=180

WORKDIR /app

RUN groupadd --system cst \
    && useradd --system --gid cst --create-home cst

COPY requirements ./requirements

RUN python -m pip install \
      --index-url https://pypi.org/simple \
      --timeout 180 \
      --retries 10 \
      -r requirements/production.txt

COPY . .

RUN mkdir -p /app/media /app/staticfiles \
    && chown -R cst:cst /app

USER cst

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
