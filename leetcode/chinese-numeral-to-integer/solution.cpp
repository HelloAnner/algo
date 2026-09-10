// 中文数字转阿拉伯数字
// 题目：给定一个中文字符串，转换成对应的阿拉伯数字（《手撕字节跳动面试时出现过的算法题》第 33 题）
//
// 思路：按「节」扫描，number 存当前一位数字，section 存当前万以下的节，遇万/亿结算进 total。
// 复杂度：时间 O(L) 空间 O(L)（L 为字符数）
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// 把一行 UTF-8 文本按「字符」切开（中文是 3 字节，不能按字节比较）
static vector<string> splitUtf8(const string &s) {
    vector<string> out;
    for (size_t i = 0; i < s.size();) {
        unsigned char c = static_cast<unsigned char>(s[i]);
        size_t len = 1;
        if ((c & 0x80) == 0x00) {
            len = 1;
        } else if ((c & 0xE0) == 0xC0) {
            len = 2;
        } else if ((c & 0xF0) == 0xE0) {
            len = 3;
        } else if ((c & 0xF8) == 0xF0) {
            len = 4;
        }
        if (i + len > s.size()) len = 1;  // 防御被截断的非法字节
        out.push_back(s.substr(i, len));
        i += len;
    }
    return out;
}

// 数字字符 -> 数值，不是数字返回 -1
static int digitOf(const string &ch) {
    if (ch == "一") return 1;
    if (ch == "二" || ch == "两") return 2;
    if (ch == "三") return 3;
    if (ch == "四") return 4;
    if (ch == "五") return 5;
    if (ch == "六") return 6;
    if (ch == "七") return 7;
    if (ch == "八") return 8;
    if (ch == "九") return 9;
    return -1;
}

// 小节单位：十 / 百 / 千
static long long smallUnitOf(const string &ch) {
    if (ch == "十") return 10;
    if (ch == "百") return 100;
    if (ch == "千") return 1000;
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    if (!getline(cin, line)) {
        cout << 0 << '\n';
        return 0;
    }

    // 去掉首尾空白（含行尾的 \r）
    size_t begin = line.find_first_not_of(" \t\r\n");
    size_t end = line.find_last_not_of(" \t\r\n");
    string s = (begin == string::npos) ? string() : line.substr(begin, end - begin + 1);

    long long total = 0;    // 已结算的高位部分
    long long section = 0;  // 当前「万」以下这一节的值
    long long number = 0;   // 当前待用的一位数字
    int sign = 1;

    for (const string &ch : splitUtf8(s)) {
        if (ch == "负") {
            sign = -1;
            continue;
        }
        if (ch == "零" || ch == "〇") continue;  // 占位符，跳过

        int d = digitOf(ch);
        if (d >= 0) {
            number = d;
            continue;
        }

        long long unit = smallUnitOf(ch);
        if (unit > 0) {
            // 「十」前面没有数字时按 1 算：十二 = 12，二十 = 20
            section += (number == 0 ? 1 : number) * unit;
            number = 0;
            continue;
        }

        if (ch == "万") {
            section = (section + number) * 10000;
            total += section;
            section = 0;
            number = 0;
            continue;
        }

        if (ch == "亿") {
            total = (total + section + number) * 100000000LL;
            section = 0;
            number = 0;
            continue;
        }

        // 其它字符（空白、标点）忽略
    }

    cout << sign * (total + section + number) << '\n';
    return 0;
}
