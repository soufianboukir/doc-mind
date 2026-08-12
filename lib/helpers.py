from datasets import load_dataset

def load_flickr30k():
    ds = load_dataset("nlphuji/flickr30k")

    df = ds["test"].to_pandas()

    return df
