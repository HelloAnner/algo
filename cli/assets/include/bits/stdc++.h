// bits/stdc++.h —— 兼容头
//
// 本机是 Apple clang + libc++，没有 GCC 那个专有的 <bits/stdc++.h>。
// algo 会把这份文件装到 ~/.local/include/bits/stdc++.h，
// 题目 Makefile / algo run 都带 -I 指过去，所以下面这一行就能用：
//
//     #include <bits/stdc++.h>
//
// 它只是把常用的标准头一次性包含进来，不做别的事。
#ifndef ALGO_BITS_STDCXX_H
#define ALGO_BITS_STDCXX_H

#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <chrono>
#include <cinttypes>
#include <climits>
#include <cmath>
#include <complex>
#include <cstdarg>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <deque>
#include <exception>
#include <forward_list>
#include <fstream>
#include <functional>
#include <iomanip>
#include <ios>
#include <iosfwd>
#include <iostream>
#include <istream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <numeric>
#include <optional>
#include <ostream>
#include <queue>
#include <random>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <streambuf>
#include <string>
#include <string_view>
#include <system_error>
#include <tuple>
#include <type_traits>
#include <typeinfo>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <valarray>
#include <variant>
#include <vector>

#endif  // ALGO_BITS_STDCXX_H
