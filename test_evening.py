import copy
import unittest
from unittest.mock import Mock
import evening


class EveningTests(unittest.TestCase):
    def setUp(self):
        self.context = {'problem': 'Build EventMemory for useful evening insights.', 'ability': 'I can build a prototype.', 'text': 'Use fan-out and fan-in for independent work.', 'source': 'Recalled idea', 'date': '2026-10-13', 'timing': 'Timestamp unavailable'}
        self.result = {'findings': [{'category': 'EXTENDS', 'headline': 'Test independent perspectives', 'connection': 'Two independent checks may reveal a useful connection.', 'this_week': 'Compare one pass with two independent passes.', 'caution': 'This is a hypothesis, not a measured result.', 'surprise': 2, 'evidence': [{'quote': self.context['problem']}, {'quote': self.context['text']}]}]}
        self.model = Mock(return_value=copy.deepcopy(self.result))

    def test_no_provider_call_without_explicit_consent(self):
        for consent in [None, False, 'true', 1]:
            with self.assertRaises(ValueError):
                evening.recap({'context': self.context, 'consent': consent}, self.model)
        self.model.assert_not_called()

    def test_invalid_input_prevents_provider_request(self):
        for patch in [{'problem': ''}, {'text': 'x' * 12001}, {'source': 12}, {'date': 'yesterday'}]:
            with self.assertRaises(ValueError):
                evening.recap({'consent': True, 'context': {**self.context, **patch}}, self.model)
        self.model.assert_not_called()

    def test_source_labels_are_rebuilt_from_input(self):
        self.result['findings'][0]['evidence'][1]['source'] = 'Invented speaker'
        out = evening.recap({'consent': True, 'context': self.context}, Mock(return_value=self.result))
        self.assertEqual(out['findings'][0]['evidence'][1]['source'], self.context['source'])
        self.assertEqual(out['findings'][0]['evidence'][1]['quote'], self.context['text'])

    def test_fabricated_quote_rejected(self):
        self.result['findings'][0]['evidence'][1]['quote'] = 'You will definitely succeed.'
        with self.assertRaisesRegex(ValueError, 'does not match'):
            evening.validate(self.result, self.context)

    def test_empty_findings_supported(self):
        out = evening.validate({'findings': [], 'reason': 'No useful connection.'}, self.context)
        self.assertEqual(out['findings'], [])

    def test_malformed_model_output_rejected(self):
        cases = [None, {'findings': 'wrong'}, {'findings': []}, {'findings': self.result['findings'] * 2}]
        for value in cases:
            with self.assertRaises(ValueError):
                evening.validate(value, self.context)

    def test_only_approved_context_is_sent(self):
        context = {**self.context, 'unrelated_history': 'Do not send this.'}
        evening.recap({'consent': True, 'context': context}, self.model)
        self.assertEqual(self.model.call_args.args[1], self.context)


if __name__ == '__main__':
    unittest.main()
