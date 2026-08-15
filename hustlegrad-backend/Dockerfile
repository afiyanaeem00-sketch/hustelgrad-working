#-------------------------- Backend Dockerfile -----------------

#download the base image 
FROM python:3.12-slim

# create a working directory where file is store
WORKDIR /app


# update the system and remove all vule 
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app source
COPY app ./app

# port where we access the site 
EXPOSE 8000

# app.main:app  ->  app/main.py, the `app = FastAPI()` object inside it
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
