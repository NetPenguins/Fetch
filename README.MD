# Fetch - Azure Enumerator

Fetch is an Azure enumerator tool designed to help security professionals and administrators analyze and enumerate Azure environments.

## Deployment Options

You can deploy Fetch using either the traditional Python setup with requirements.txt or using Docker.

### Option 1: Traditional Setup

1. Clone the repository:

```
git clone https://github.com/felixguerrero12/fetch.git
cd fetch
```

2. Create a virtual environment (optional but recommended):

```
python -m venv venv
source venv/bin/activate  # On Windows, use venv\Scripts\activate
```

3. Install the required packages:
```
pip install -r requirements.txt
```

4. Run the application:
```
python app.py
```

5. Access the application in your web browser at `http://localhost:5000`

### Option 2: Docker Deployment
1. Clone the repository:

```
git clone https://github.com/felixguerrero12/fetch.git
cd fetch
```

2. Build and run the Docker container:
```
docker-compose up --build
```
