# Useful commands

### Enter the postres command line

```
docker exec -it docmind-db psql -U docmind -d doc_mind_db
```

**drop all the schema (tables)**

```
DROP SCHEMA public CASCADE;
```
