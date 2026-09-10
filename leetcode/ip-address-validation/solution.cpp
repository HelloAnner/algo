// IP 地址判断（IPv4 合法性校验）
// https://leetcode.cn/problems/validate-ip-address/
//
// 思路：逐行读入，手工按 '.' 切分，检查字符、段数、空段、前导零与 0~255 范围。
// 复杂度：时间 O(L)（L 为总字符数） 空间 O(1)
#include <iostream>
#include <limits>
#include <string>
#include <vector>

using namespace std;

// 判断 s 是否为合法 IPv4
bool isIPv4(const string &s) {
    if (s.empty()) return false;

    // 手工切分，空段也要保留（1..2.3 里的空段不能被吞掉）
    vector<string> parts;
    string cur;
    for (char c : s) {
        if (c == '.') {
            parts.push_back(cur);
            cur.clear();
        } else if (c >= '0' && c <= '9') {
            cur.push_back(c);
        } else {
            return false;  // 出现了数字和 '.' 之外的字符
        }
    }
    parts.push_back(cur);

    if (parts.size() != 4) return false;  // 段数必须恰好为 4

    for (const string &p : parts) {
        if (p.empty()) return false;                    // 空段
        if (p.size() > 3) return false;                 // 4 位以上必然 > 255
        if (p.size() > 1 && p[0] == '0') return false;  // 前导零
        int v = 0;
        for (char c : p) v = v * 10 + (c - '0');
        if (v > 255) return false;                      // 超出范围
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');  // 吃掉第一行行尾，否则首个 getline 读到空串

    string line;
    for (int i = 0; i < n; ++i) {
        if (!getline(cin, line)) line.clear();  // 输入不足按空行处理
        if (!line.empty() && line.back() == '\r') line.pop_back();
        cout << (isIPv4(line) ? "valid" : "invalid") << '\n';
    }
    return 0;
}
