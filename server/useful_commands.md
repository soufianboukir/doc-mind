# Useful commands

### Enter the postres command line

```
docker exec -it docmind-db psql -U docmind -d doc_mind_db
```

----------------------------


**drop all the schema (tables)**

```
DROP SCHEMA public CASCADE;
```

-----------------------------

down the container 

```
docker compose down -v
```

-----------------------------

up in background will create tables again

```
docker compose up -d
```

-----------------------------

enter the database via CMD and show tables
```
docker exec -it docmind-db psql -U docmind -d doc_mind_db
\dt
```
