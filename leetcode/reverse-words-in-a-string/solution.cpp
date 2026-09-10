// 翻转字符串里的单词
// https://leetcode.cn/problems/reverse-words-in-a-string/
//
// 思路：getline 读整行，istringstream 按空白切词（自动跳过多余空格），再倒序用单个空格拼接。
// 复杂度：时间 O(n) 空间 O(n)
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    if (!getline(cin, line)) return 0;

    vector<string> words;
    istringstream iss(line);
    for (string word; iss >> word;) words.push_back(word);

    int total = static_cast<int>(words.size());
    for (int i = total - 1; i >= 0; --i) {
        if (i != total - 1) cout << ' ';
        cout << words[i];
    }
    cout << '\n';
    return 0;
}
