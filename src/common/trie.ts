// author:
// https://medium.com/@suyashtiwari1798/trie-typescript-4d88be3ec561
// I know I have my own implementation somewhere, but it was in Java and I was lazy, so...

class Trie {
    map: { [key: string]: Trie } = {};
    isWord: boolean = false;
    isBskySocial: boolean = false;
    constructor() {
    }

    public insert(word: string): void {
        this.add(word, 0, this)
    }

    public search(word: string): boolean | string {
        return this.find(word, 0, this);
    }

    private add(word: string, index: number, letterMap: Trie): void {
        if (word.endsWith('.bsky.social') && word.length - index == 12) {
            letterMap.isBskySocial = true;
        }
        if (index == word.length) {
            letterMap.isWord = true
            return;
        }
        if (!letterMap.map[word.charAt(index)]) {
            letterMap.map[word.charAt(index)] = new Trie()
        }
        return this.add(word, index + 1, letterMap.map[word.charAt(index)])
    }

    private find(word: string, index: number, letterMap: Trie): boolean | string {
        if (letterMap.isBskySocial) {
            return word + '.bsky.social';
        }
        if (index == word.length) {
            if (letterMap.isWord) {
                return word;
            }
            return false
        }
        if (letterMap.map[word[index]]) {
            return this.find(word, index + 1, letterMap.map[word.charAt(index)])
        }
        return false
    }
}

export { Trie }